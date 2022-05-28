import React from 'react';
import {StyleSheet, View, Text} from 'react-native';

type Props = {
  para: string;
  fixedWidth: boolean;
};

export const ParaCard: React.FC<Props> = ({para, fixedWidth}: Props) => {
  let wrapperStyle = fixedWidth
    ? [styles.wrapper, styles.fixedWidth]
    : [styles.wrapper];
  return (
    <View style={wrapperStyle}>
      <Text style={styles.para} numberOfLines={5000} ellipsizeMode="tail">
        {process(para)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fixedWidth: {
    width: 300,
    marginBottom: 0,
  },
  wrapper: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginHorizontal: 10,
    marginBottom: 20,
    padding: 10,
    borderRadius: 5,
  },
  para: {
    lineHeight: 20,
    fontFamily: 'Georgia',
  },
  highlight: {
    backgroundColor: '#FFFFA7',
  },
  normal: {},
});

function process(para: string) {
  const reFilter = /(<p>|<\/p>|<br>|<i>|<\/i>|<source>|<\/source>)/gi;
  let filtered = para.replace(reFilter, '');
  let segments = filtered.split(/<mark>|<\/mark>/);
  return segments.map((seg, index) => (
    <Text key={index} style={index % 2 ? styles.highlight : styles.normal}>
      {seg}
    </Text>
  ));
}
