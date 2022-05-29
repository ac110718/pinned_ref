use oauth1::Token;
use serde;
use serde_derive::*;
use serde_json;
use std::borrow::Cow;
use std::collections::HashMap;
const URL: &str = "https://www.instapaper.com/api";

pub struct Client {
    pub consumer_key: String,
    pub consumer_secret: String,
    pub token_key: Option<String>,
    pub token_secret: Option<String>,
}

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
pub struct ClientError {
    error: String,
}

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
pub struct List {
    pub bookmarks: Vec<Bookmark>,
    pub user: User,
    pub highlights: Vec<Highlight>,
    #[serde(default)]
    pub delete_ids: Vec<i64>,
}

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
pub struct Highlight {
    pub highlight_id: i64,
    pub bookmark_id: i64,
    pub text: String,
    pub note: Option<String>,
    pub time: i64,
    pub position: i64,
    #[serde(rename = "type")]
    pub kind: String,
}

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
pub struct Bookmark {
    pub title: String,
    pub hash: String,
    pub bookmark_id: i64,
    pub progress_timestamp: f64,
    pub description: String,
    pub url: String,
    pub time: f64,
    pub starred: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub private_source: String,
}

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
pub struct User {
    pub username: String,
    pub user_id: i64,
    #[serde(rename = "type")]
    pub kind: String,
    #[serde(rename = "subscription_is_active")]
    pub subscription: String,
}

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
pub struct Article {
    pub bookmark_id: i64,
    pub text: String,
}

impl Client {
    pub fn get_bookmarks(&self, folder: &str) -> Result<List, reqwest::Error> {
        let mut params: HashMap<&str, Cow<str>> = HashMap::new();
        params.insert("limit", Cow::Borrowed("500"));
        params.insert("folder_id", Cow::Borrowed(folder));
        let mut response = signed_request("bookmarks/list", params, self)?;
        response.json().map_err(|x| x.into())
    }

    pub fn get_text(&self, bookmark_id: i64) -> Result<Article, reqwest::Error> {
        let mut params: HashMap<&str, Cow<str>> = HashMap::new();
        let id = bookmark_id.to_string();
        params.insert("bookmark_id", Cow::Borrowed(&id));
        let mut response = signed_request("bookmarks/get_text", params, self)?;
        println!("Article downloaded for id: {}", id);
        Ok(Article {
            bookmark_id,
            text: response.text()?,
        })
    }
}

// pass in consumer key and consumer secret, along with user and pw first
// in order to populate the token keys and secret for subsequent requests
// response comes back in qline from Instapaper

pub fn authenticate(
    username: &str,
    password: &str,
    consumer_key: &str,
    consumer_secret: &str,
) -> Result<Client, ClientError> {
    let mut params: HashMap<&str, Cow<str>> = HashMap::new();
    params.insert("x_auth_username", Cow::Borrowed(username));
    params.insert("x_auth_password", Cow::Borrowed(password));
    params.insert("x_auth_mode", Cow::Borrowed("client_auth"));

    let mut client = Client {
        consumer_key: consumer_key.to_owned(),
        consumer_secret: consumer_secret.to_owned(),
        token_key: None,
        token_secret: None,
    };

    let mut response = signed_request("oauth/access_token", params, &client);
    let qline = response.unwrap().text().unwrap();
    let pairs: Vec<&str> = qline.split("&").collect();
    for pair in pairs {
        let key_value: Vec<&str> = pair.split("=").collect();
        match key_value[0] {
            "oauth_token_secret" => client.token_secret = Some(key_value[1].to_string()),
            "oauth_token" => client.token_key = Some(key_value[1].to_string()),
            _ => println!("Returned {} : {}", key_value[0], key_value[1]),
        }
    }
    if client.token_key.is_none() {
        Err(ClientError {
            error: "Tokens not returned from API".to_string(),
        })
    } else {
        println!("Successfully authenticated.");
        Ok(client)
    }
}

fn signed_request(
    path: &str,
    params: HashMap<&'static str, Cow<str>>,
    client: &Client,
) -> reqwest::Result<reqwest::Response> {
    let http_client = reqwest::Client::new();
    let url = format!("{}/1.1/{}", URL, path);
    let empty_string = String::new();
    let token = Token::new(
        client.token_key.as_ref().unwrap_or(&empty_string),
        client.token_secret.as_ref().unwrap_or(&empty_string),
    );
    let oauth: Option<&Token> = if client.token_key.as_ref().is_some() {
        Some(&token)
    } else {
        None
    };

    let request = http_client
        .post(&url)
        .form(&params)
        .header(
            reqwest::header::AUTHORIZATION,
            oauth1::authorize(
                "POST",
                &url,
                &Token::new(&client.consumer_key, &client.consumer_secret),
                oauth,
                Some(params),
            ),
        )
        .build()?;
    http_client.execute(request)?.error_for_status()
}
