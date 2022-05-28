import React, {useState} from 'react';
import {
  SectionList,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import {EntryArticle} from '../components/EntryArticle';
import type {StackScreenProps} from '@react-navigation/stack';
import {Article, Reduced, RootStackParamList} from '../types';

type Props = StackScreenProps<RootStackParamList, 'ArticleList'>;

export const ArticleList: React.FC<Props> = ({navigation, route}: Props) => {
  const {articles}: {articles: Reduced[]} = route.params!;
  const DATA = [{title: ' ', data: articles}];
  articles.sort((a, b) => b.highlights - a.highlights);

  const navButtons = () => {
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('MultiArticle')}>
        <Text style={styles.textButton}>➦</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={DATA}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <EntryArticle article={item} navigation={navigation} />
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
    height: 40,
  },
  container: {
    flex: 1,
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
    left: 15,
    bottom: 47,
  },
  textButton: {
    fontSize: 30,
    color: 'rgba(0, 59, 79, .6)',
    transform: [{scaleY: -1}, {rotate: '180deg'}],
    paddingTop: 5,
  },
});
