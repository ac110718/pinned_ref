import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity, FlatList} from 'react-native';
import {ParaCard} from '../components/ParaCard';
import {RootStackParamList, Article} from '../types';
import type {StackNavigationProp} from '@react-navigation/stack';

type Props = {
  navigation: StackNavigationProp<
    RootStackParamList,
    'MultiArticle',
    undefined
  >;
  article: Article;
};

export const RowDisplay: React.FC<Props> = ({navigation, article}) => {
  const renderItem = ({item}: {item: string}) => {
    return (
      <TouchableOpacity
        onLongPress={() =>
          navigation.navigate('SingleArticle', {
            article_id: article.bookmark_id,
          })
        }>
        <ParaCard para={item} fixedWidth={true} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('SingleArticle', {
              article_id: article.bookmark_id,
            });
          }}>
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.domain}>{article.domain}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        style={styles.row}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        data={article.cards}
        renderItem={renderItem}
        keyExtractor={(item, index) => index + article.bookmark_id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    maxHeight: 325,
  },
  row: {
    padding: 5,
    marginBottom: 5,
  },
  header: {
    marginLeft: 15,
    paddingVertical: 10,
    fontFamily: 'Helvetica Neue',
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
    marginTop: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF791E',
  },
  domain: {
    fontSize: 13,
  },
});
