import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {Reduced, RootStackParamList} from '../types';
import type {StackNavigationProp} from '@react-navigation/stack';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'ArticleList', undefined>;
  article: Reduced;
};

export const EntryArticle: React.FC<Props> = ({navigation, article}: Props) => {
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('SingleArticle', {article_id: article.id});
      }}>
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.title} ellipsizeMode="tail" numberOfLines={1}>
            {article.title}
          </Text>
          <Text style={styles.domain}>{article.domain}</Text>
        </View>
        <View>
          <Text style={styles.highlightWrapper}>
            <Text style={styles.icon}>✎</Text> {article.highlights}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  icon: {
    fontSize: 17,
    textAlign: 'left',
  },
  header: {
    alignSelf: 'flex-start',
    maxWidth: 320,
  },
  highlightWrapper: {
    width: 35,
    textAlign: 'right',
    color: '#AAAAAA',
    fontWeight: 'bold',
    fontSize: 13,
  },
  wrapper: {
    height: 40,
    marginHorizontal: 15,
    paddingVertical: 10,
    fontFamily: 'Helvetica Neue',
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FF791E',
  },
  domain: {
    fontSize: 13,
  },
});
