import React from 'react';
import { articleData } from './data/article_data';

type AppContextType = {
  articleList: ArticleObj[];
  activeArticle: ArticleObj;
  handleList: (list: ArticleObj[]) => void;
  handleArticle: (article: ArticleObj) => void;
  hello: string;
};

type ArticleObj = {
    title: string;
    url: string;
    domain: string;
    cards: string[];
    bookmark_id: number;
    ranking: number;
}

const defaultValue = {
  articleList: articleData,
  activeArticle: articleData[1],
  handleList: () => {},
  handleArticle: () => {},
  hello: "default",
};

const AppContext = React.createContext<AppContextType>(defaultValue);
export const AppProvider: React.FC = ({ children }) => {
    const [articleList, setArticleList] = React.useState<ArticleObj[]>([]);
    const [activeArticle, setActiveArticle] = React.useState<ArticleObj>([]);
    const hello = "changed";
    const handleList = React.useCallback((list : ArticleObj[]) => {
        setArticleList(list);
    }, []);

    const handleArticle = ((article: ArticleObj) => {
        console.warn("hello");
        setActiveArticle(article);
    }, [article]);

    return (
        <AppContext.Provider value={{ hello, articleList, handleList, activeArticle, handleArticle}}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => React.useContext(AppContext);