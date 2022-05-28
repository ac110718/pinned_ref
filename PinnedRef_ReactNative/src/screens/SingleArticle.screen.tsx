import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {ParaCard} from '../components/ParaCard';
import {articleData} from '../data/article_data';
import type {StackScreenProps} from '@react-navigation/stack';
import {Article, Reduced, RootStackParamList} from '../types';

type Props = StackScreenProps<RootStackParamList, 'SingleArticle'>;

export const SingleArticle: React.FC<Props> = ({navigation, route}) => {
  const {article_id}: {article_id: number} = route.params!;
  const article = articleData.filter(x => x.bookmark_id == article_id)[0];

  const navButtons = () => {
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.textButton}>➦</Text>
      </TouchableOpacity>
    );
  };
  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.spacer}></View>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => Linking.openURL(article.url)}>
            <Text style={styles.title}>{article.title}</Text>
            <Text style={styles.domain}>{article.domain}</Text>
          </TouchableOpacity>
        </View>
        {article.cards.map((paragraph: string, index: number) => (
          <ParaCard key={index} para={paragraph} fixedWidth={false} />
        ))}
      </ScrollView>
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
    backgroundColor: 'white',
    padding: 5,
  },
  header: {
    margin: 10,
    padding: 10,
    fontFamily: 'Helvetica Neue',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FF791E',
  },
  domain: {
    fontSize: 13,
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
