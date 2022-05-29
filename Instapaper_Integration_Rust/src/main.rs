use instapaper::insta_client::*;
use regex::{escape, Regex};
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::prelude::*;
use std::io::{BufReader, BufWriter, Write};
use std::path::Path;
use url::Url;
use dotenv::dotenv;
use std::env;
use serde;
use serde_derive::*;
use serde_json;
use rand::Rng;


const BOOKMARKS_FILE: &str = "./data/bookmarks.json";
const FULL_TEXT_FILE: &str = "./data/full_text.json";
const OUTPUT_HTML: &str = "./data/output.html";
const ARTICLE_DATA: &str = "./data/article_data.json";


fn main() -> std::io::Result<()> {
    let mut path = Path::new(ARTICLE_DATA);
    if path.exists() {
        println!("Article data already saved");
    } else {
        println!("Generating article data...");
        generate_data()?;
    }
    let article_data = load_article_data()?;
    random_summary(&article_data);
    generate_search_index(&article_data);
    Ok(())
}

fn generate_data() -> std::io::Result<()> {
    dotenv().ok();
    // load authentication data
    let CONSUMER_KEY:&str = &env::var("CONSUMER_KEY").unwrap();
    let CONSUMER_SECRET:&str = &env::var("CONSUMER_SECRET").unwrap();
    let USER:&str = &env::var("USER_NAME").unwrap();
    let PW:&str = &env::var("PW").unwrap();

    // check bookmarks list
    let mut path = Path::new(BOOKMARKS_FILE);
    if path.exists() {
        println!("Bookmarks already saved");
    } else {
        println!("Downloading bookmarks");
        // save_bookmarks(USER, PW, CONSUMER_KEY, CONSUMER_SECRET);
    }

    let list = load_bookmarks()?;

    // check full text
    path = Path::new(FULL_TEXT_FILE);
    if path.exists() {
        println!("Articles already saved");
    } else {
        println!("Downloading bookmarks");
        // save_text(&list, USER, PW, CONSUMER_KEY, CONSUMER_SECRET);
    }

    let articles = load_articles()?;

    // get only relevant paragraphs
    let highlighted_articles = article_objects(&list, &articles);
    generate_articles(&highlighted_articles);
    return Ok(());
}

fn save_bookmarks(user: &str, pw: &str, consumer_key: &str, consumer_secret: &str) -> std::io::Result<()> {
    let client = authenticate(user, pw, consumer_key, consumer_secret).unwrap();
    let bookmarks1 = client.get_bookmarks("archive");
    let bookmarks2 = client.get_bookmarks("Archive-02");

    match (bookmarks1, bookmarks2) {
        (Ok(mut list1), Ok(mut list2)) => {
            list1.highlights.append(&mut list2.highlights);
            list1.bookmarks.append(&mut list2.bookmarks);
            let mut file = File::create(BOOKMARKS_FILE)?;
            serde_json::to_writer(&mut file, &list1)?;
            println!(
                "Saved {} bookmarks and {} highlights",
                list1.bookmarks.len(),
                list1.highlights.len()
            )
        }
        _ => {
            println!("Failed to save bookmarks.");
        }
    }
    println!("Bookmarks saved to ./{}", BOOKMARKS_FILE);
    Ok(())
}

fn load_bookmarks() -> std::io::Result<(List)> {
    let file = File::open(BOOKMARKS_FILE)?;
    let list: List = serde_json::from_reader(file)?;
    Ok(list)
}

fn save_text(list: &List, user: &str, pw: &str, consumer_key: &str, consumer_secret: &str) -> std::io::Result<()> {
    let client = authenticate(user, pw, consumer_key, consumer_secret).unwrap();
    let mut relevant_bookmarks: Vec<i64> = list.highlights.iter().map(|x| x.bookmark_id).collect();
    let unique_bookmarks: HashSet<i64> = relevant_bookmarks.into_iter().collect();
    relevant_bookmarks = unique_bookmarks.into_iter().collect();
    println!("{:?}", &relevant_bookmarks[0]);
    let mut articles: Vec<Article> = Vec::new();
    for i in 0..relevant_bookmarks.len() {
        let article = client.get_text(relevant_bookmarks[i]);
        match article {
            Ok(article) => articles.push(article),
            _ => println!("Error getting {}", &relevant_bookmarks[i]),
        }
    }
    let mut file = File::create(FULL_TEXT_FILE)?;
    serde_json::to_writer(&mut file, &articles)?;
    println!("Saved {} articles", articles.len(),);
    Ok(())
}

fn load_articles() -> std::io::Result<(Vec<Article>)> {
    let file = File::open(FULL_TEXT_FILE)?;
    let articles: Vec<Article> = serde_json::from_reader(file)?;
    Ok(articles)
}

fn article_items(article: &Article) -> Vec<String> {
    let footnotes = Regex::new(r"<a(.*?)>d{1}</a>").unwrap();
    let unwanted_tags = Regex::new(r"<[/]?(a|img|div|ul|ol)(.*?)>|\n").unwrap();
    let without_footnotes = footnotes.replace_all(&article.text, "");
    let filtered_text = unwanted_tags.replace_all(&without_footnotes, "");
    let tags = vec!["p", "h1", "h2", "h3", "h4", "h5", "h6", "li"];
    let tag_string = tags
        .into_iter()
        .map(|x| format!("<{}>(.*?)</{}>", x, x))
        .collect::<Vec<String>>()
        .join("|");
    let extractors = Regex::new(&tag_string).unwrap();
    extractors
        .find_iter(&filtered_text.into_owned())
        .map(|elem| elem.as_str().to_string())
        .collect()
}

fn gather_highlights(list: &List) -> HashMap<i64, Vec<String>> {
    let mut map = HashMap::new();
    for highlight_list in &list.highlights {
        let mut highlight_texts: Vec<String> = highlight_list
            .text
            .split("\n")
            .filter(|s| !s.is_empty() && s.chars().count() > 15)
            .map(|s| s.to_string())
            .collect();
        let mut values = map
            .entry(highlight_list.bookmark_id)
            .or_insert_with(|| Vec::new());
        values.append(&mut highlight_texts);
    }
    return map;
}

fn article_objects(list: &List, articles: &Vec<Article>) -> Vec<HighlightedArticle> {
    let mut result = vec![];
    let highlights = gather_highlights(&list);

    for article in articles {
        let bm_item: Vec<&Bookmark> = list
            .bookmarks
            .iter()
            .filter(|bm| bm.bookmark_id == article.bookmark_id)
            .collect();
        let ha = HighlightedArticle {
            title: bm_item[0].title.to_string(),
            bookmark_id: article.bookmark_id,
            article_items: article_items(article),
            url: bm_item[0].url.to_string(),
            raw_highlights: highlights.get(&article.bookmark_id).unwrap().to_owned(),
        };
        result.push(ha);
    }
    return result;
}

fn generate_articles(ha: &Vec<HighlightedArticle>) {
    let mut collector : Vec<ArticleCards> = Vec::new();
    for art in ha {
        let parens = art
        .raw_highlights
        .iter()
        .map(|x| format!("({})", escape(x)))
        .collect::<Vec<String>>();
        let raw_string = parens.join("|");
        let re_filter = Regex::new(&raw_string).unwrap();
        let html_filter = Regex::new(r"<[/]?(em|strong|span|figure|figcaption|picture|li|h1|h2|h3|h4)(.*?)>|<[/]?span>").unwrap();
        let mut filtered_items: Vec<&String> = art
        .article_items
        .iter()
        .filter(|x| re_filter.is_match(&html_filter.replace_all(x, "").into_owned()))
        .collect();
        if filtered_items.len() == 0 {
            filtered_items = art.raw_highlights.iter().map(|x| x).collect();
        }
        let mut paragraphs: Vec<String> = Vec::new();
        
        for item in &filtered_items {
            let mut item_clean = html_filter.replace_all(&item, "").to_string();
            for highlight in &art.raw_highlights {
                let escaped = escape(&highlight);
                let re = Regex::new(&escaped).unwrap();
                item_clean = re.replace_all(&item_clean, format!("<mark>{}</mark>", highlight)).to_string();
            }
            let mark = Regex::new("<mark>").unwrap();
            if !mark.is_match(&item_clean) {
                println!("Unhighlighted {:?}", &item);
                println!("Potential Highlights {:?}", &art.raw_highlights);
            }
            let bullet = Regex::new("<li><p>").unwrap();
            item_clean = bullet.replace_all(&item_clean, "<p>").to_string();
            let para_marked = Regex::new("<p>(.*?)</p>").unwrap();
            if !para_marked.is_match(&item_clean) {
                item_clean = format!("<p>{}</p>", &item_clean);
            }
            paragraphs.push(item_clean.to_string());
        }
        println!("Processing {}", &art.title);
        let host = Url::parse(&art.url).unwrap().host().unwrap().to_string();
        let article_cards = ArticleCards {
            bookmark_id: art.bookmark_id,
            title: art.title.to_string(),
            url: art.url.to_string(),
            domain: host,
            cards: paragraphs,
            ranking: 0,
        };
        collector.push(article_cards);
    }
    let mut article_data = File::create(ARTICLE_DATA).unwrap();
    serde_json::to_writer(&mut article_data, &collector).unwrap();
}

fn load_article_data() -> std::io::Result<(Vec<ArticleCards>)> {
    let file = File::open(ARTICLE_DATA)?;
    let articles: Vec<ArticleCards> = serde_json::from_reader(file)?;
    Ok(articles)
}

fn random_summary(article_data : &Vec<ArticleCards>) {
    let display = 10;
    struct Chosen {
        title: String,
        text: String,
        url: String,
        domain: String,
        length: usize,
        others: usize,
    }
    let mut chosen_vec : Vec<Chosen> = Vec::new();
    for i in 0..display {
        let mut rng_article = rand::thread_rng();
        let mut rng_highlight = rand::thread_rng();
        let art_idx = rng_article.gen_range(0..article_data.len());
        let highlight_idx = rng_highlight.gen_range(0..article_data[art_idx].cards.len());
        let selected = Chosen {
            title: article_data[art_idx].title.to_string(),
            text: article_data[art_idx].cards[highlight_idx].to_string(),
            url: article_data[art_idx].url.to_string(),
            domain: article_data[art_idx].domain.to_string(),
            length: article_data[art_idx].cards[highlight_idx].len(),
            others: article_data[art_idx].cards.len(),
        };
        chosen_vec.push(selected);
    }
    let mut output_string = r#"<html><head><title>Instapaper Highlights</title><link rel="stylesheet" href="card_style.css"></head><body><div class="wrapper">"#.to_string();
    chosen_vec.sort_by(|a, b| b.length.cmp(&a.length));
    let halfway = chosen_vec.iter().map(|x| x.length).reduce(|a,b| a + b).unwrap() / 2;
    let mut col_break = 0;
    let mut running_total = 0;
    for i in 0..display {
        running_total = running_total + &chosen_vec[i].length;
        println!("running total {} vs. halfway {}", &running_total, &halfway);
        if (running_total > halfway) {
            col_break = i+1;
            println!("break {}", &col_break);
            break;
        }
    }
    for i in 0..display {
        let article = &chosen_vec[i];
        let escaped = Regex::new(r#"(:[^\\"]|\\.)"#).unwrap();
        if i == 0 || i == col_break {
            output_string = format!("{}<div class='col'>", output_string);
        }
        output_string = format!("{}<div class='card'><h3>{}</h3>{}<h5>{} other highlights<h5><h4><a href={}>{}</a></h4></div>", 
            output_string, article.title, escaped.replace_all(&article.text,r#"""#), article.others, article.url, article.domain);
        if i == col_break - 1 || i == display {
            output_string = format!("{}</div>", output_string);
        }
    }
    output_string = format!("{}</div></body>", output_string);
    let mut output_html = File::create("./data/summary_cards.html").unwrap();
    output_html.write_all(output_string.as_bytes()).unwrap();
}

fn generate_search_index(articles: &Vec<ArticleCards>) {
    let mut word_map : HashMap<String, HashSet<i64>> = HashMap::new();
    let html_filter = Regex::new(r#"<[/]?(em|strong|span|figure|figcaption|font|picture|li|h1|h2|h3|h4|p|mark|i|b)(.*?)>|<[/]?span>|  |\?"#).unwrap();
    let mut common_words : HashSet<String> = HashSet::new();
    for article in articles {
        println!("processing {}", &article.bookmark_id);
        let mut para_text = article.cards.join(" ");
        para_text = para_text + &article.title + &article.domain;
        para_text = html_filter.replace_all(&para_text, "").to_string();
        para_text = para_text.to_lowercase();
        for word in para_text.split([':', '-', ' ', ')','(', '–', '.', '\\', ',','”', '“', '’', '\"', '—', ';', '”', '/'].as_ref()) {
            let set = word_map.entry(word.to_string()).or_insert(HashSet::new());
            if set.len() > 100 {
                common_words.insert(word.to_string());
            }
            set.insert(article.bookmark_id.clone());
        }
    }
    println!("Common words {:?}", common_words);
    for word in common_words {
        word_map.remove(&word);
    }
    println!("terms indexed: {}", word_map.keys().len());
    let mut search_file = File::create("search_index.json").unwrap();
    serde_json::to_writer(&mut search_file, &word_map).unwrap();
}

#[derive(Debug, Clone, Default)]
pub struct HighlightedArticle {
    title: String,
    bookmark_id: i64,
    url: String,
    raw_highlights: Vec<String>,
    article_items: Vec<String>,
}

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
pub struct ArticleCards {
    title: String,
    bookmark_id: i64,
    url: String,
    domain: String,
    cards: Vec<String>,
    ranking: i64,
}