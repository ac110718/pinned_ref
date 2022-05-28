import React, {useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  TextInput,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SectionList,
  Image,
} from 'react-native';
import {RowDisplay} from '../components/RowDisplay';
import {articleData} from '../data/article_data';
import {search_index} from '../data/search_index';
import {Article, Reduced, RootStackParamList} from '../types';
import type {StackScreenProps} from '@react-navigation/stack';

type Props = StackScreenProps<RootStackParamList, 'MultiArticle'>;

let articleMap: Map<number, Article> = new Map();
for (let article of articleData) {
  articleMap.set(article.bookmark_id, article);
}
const allList = [...articleMap.keys()].sort(
  (a, b) => articleMap.get(b)!.cards.length - articleMap.get(a)!.cards.length,
);

let searchIndex: Map<string, number[]> = new Map();
for (const [key, value] of Object.entries(search_index)) {
  searchIndex.set(key, value);
}

const vocabulary = Array.from(searchIndex.keys());
const process = (text: string) => {
  let relevant_articles = new Set<number>();
  if (text !== '') {
    let search_text = text.trim();
    search_text = search_text.replace(/[^a-z0-9]/gi, '');
    search_text = search_text.split(new RegExp(/or/, 'ig')).join('|');
    if (search_text.charAt(search_text.length - 1) == '|') {
      search_text = search_text.slice(0, -1);
    }
    let terms = search_text.split(new RegExp(/and/, 'ig'));

    for (let i = 0; i < terms.length; i++) {
      if (terms[i] !== '') {
        let re = new RegExp(terms[i], 'i');
        let search_terms = vocabulary.filter(word => re.test(word));
        let found = new Set<number>();
        search_terms
          .flatMap(word => searchIndex.get(word)!)
          .forEach(x => found.add(x));
        if (i == 0) {
          relevant_articles = found;
        } else {
          relevant_articles = new Set(
            [...relevant_articles].filter(x => found.has(x)),
          );
        }
      }
    }
  }
  return relevant_articles;
};

// timeout needs to be scoped above the function and the component so that it can be properly cleared
// otherwise, scope of timeout gets lost
let timeout: ReturnType<typeof setTimeout>;
const debounce = (callback: () => void, delay: number) => {
  return function () {
    clearTimeout(timeout);
    console.log('CLEAR');
    timeout = setTimeout(callback, delay);
  };
};

export const MultiArticle: React.FC<Props> = ({navigation}: Props) => {
  const empty: string[] = [];
  const [articleList, setArticleList] = useState(allList);
  const [searchToggle, setSearchToggle] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [matches, setMatches] = useState(0);
  const scrollRef = useRef<SectionList>(null);

  const searchChange = (text: string) => {
    setSearchTerm(text);
    debounce(() => findMatch(text, false), 400)();
  };

  const refresh = () => {
    scrollRef.current!.scrollToLocation({
      sectionIndex: 0,
      itemIndex: 0,
      animated: true,
    });
  };

  const findMatch = (text: string, render: boolean) => {
    console.log('FIRE');
    let relevant_articles = process(text);
    render ? refresh() : null;
    render
      ? text == ''
        ? setArticleList(allList)
        : setArticleList([...relevant_articles])
      : setMatches(relevant_articles.size);
  };

  const DATA = [{title: ' ', data: articleList}];

  const reduced = (id: number) => {
    let article = articleMap.get(id)!;
    return {
      id,
      title: article.title,
      domain: article.domain,
      highlights: article.cards.length,
    } as Reduced;
  };

  const navButtons = () => {
    return (
      <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={0}>
        <TouchableOpacity
          style={[styles.floatingButton, styles.searchButton]}
          onPress={() => setSearchToggle(!searchToggle)}>
          <Image style={styles.logo} source={require('../logo_navy.png')} />
        </TouchableOpacity>
        {searchToggle ? (
          <View>
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={() => {
                navigation.navigate('ArticleList', {
                  articles: articleList.map(x => reduced(x)),
                });
              }}>
              <Text style={styles.textButton}>≡</Text>
            </TouchableOpacity>
            <TextInput
              onChangeText={text => searchChange(text)}
              onSubmitEditing={event => findMatch(event.nativeEvent.text, true)}
              autoFocus={true}
              style={styles.searchBar}
              value={searchTerm}
              placeholder="Search Keywords"
            />
          </View>
        ) : null}
        {searchToggle ? (
          <Text style={styles.matches}>{matches} articles </Text>
        ) : null}
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={styles.container}>
      <SectionList
        ref={scrollRef}
        sections={DATA}
        keyExtractor={item => item.toString()}
        renderItem={({item}) => (
          <RowDisplay article={articleMap.get(item)!} navigation={navigation} />
        )}
        renderSectionHeader={({section: {title}}) => (
          <View style={styles.spacer} />
        )}
      />
      {navButtons()}
    </View>
  );
};

const styles = StyleSheet.create({
  spacer: {
    height: 50,
  },
  logo: {
    marginTop: 2,
    height: 40,
    width: 40,
  },
  matches: {
    position: 'absolute',
    bottom: 58,
    right: 40,
    color: 'rgba(14, 157, 200, 1)',
  },
  searchBar: {
    position: 'absolute',
    width: 270,
    height: 40,
    bottom: 48,
    right: 30,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    paddingHorizontal: 10,
    fontFamily: 'Helvetica Neue',
    backgroundColor: 'rgba(230, 230, 230, .9)',
  },
  searchButton: {
    left: 15,
  },
  searchTextButton: {
    transform: [{rotate: '0deg'}],
    fontSize: 25,
    fontWeight: '900',
    paddingTop: 6,
  },
  floatingButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderBottomColor: '#CCCCCC',
    borderTopColor: '#CCCCCC',
    backgroundColor: 'rgba(200, 200, 200, .3)',
    alignItems: 'center',
    alignContent: 'space-around',
    justifyContent: 'center',
    left: 70,
    bottom: 47,
  },
  textButton: {
    fontSize: 30,
    color: '#AAAAAA',
    transform: [{rotate: '0deg'}],
  },
  container: {
    flex: 1,
  },
});
