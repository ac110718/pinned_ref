import {EntryArticle} from './components/EntryArticle';
export type Article = {
  title: string;
  url: string;
  domain: string;
  cards: string[];
  ranking: number;
  bookmark_id: number;
};

export type Reduced = {
  id: number;
  title: string;
  domain: string;
  highlights: number;
};

export type RootStackParamList = {
  ArticleList: {articles: Reduced[]};
  MultiArticle: undefined;
  SingleArticle: {article_id: number};
};
