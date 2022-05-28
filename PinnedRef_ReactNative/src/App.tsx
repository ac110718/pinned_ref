import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {MultiArticle} from './screens/MultiArticle.screen';
import {SingleArticle} from './screens/SingleArticle.screen';
import {ArticleList} from './screens/ArticleList.screen';
import {RootStackParamList} from './types';

const Stack = createStackNavigator<RootStackParamList>();

export const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MultiArticle"
          component={MultiArticle}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="SingleArticle"
          component={SingleArticle}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ArticleList"
          component={ArticleList}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
