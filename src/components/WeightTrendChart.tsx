import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { convertWeight } from '../lib/weightUnit';
import type { WeightEntry, WeightUnit } from '../types/weightEntry';

type WeightTrendChartProps = {
  entries: WeightEntry[];
  displayUnit: WeightUnit;
};

const CHART_WIDTH = 320;
const CHART_HEIGHT = 160;
const PADDING_LEFT = 36;
const PADDING_RIGHT = 16;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 24;

export function WeightTrendChart({ entries, displayUnit }: WeightTrendChartProps) {
  if (entries.length === 0) {
    return null;
  }

  // Entries can be logged in either unit — convert everything to a single
  // display unit before plotting so the chart never treats raw kg and lb
  // numbers as directly comparable on the same scale.
  const values = entries.map((entry) => convertWeight(entry.weight, entry.unit, displayUnit));

  if (entries.length === 1) {
    return (
      <View style={styles.singlePointContainer}>
        <Text style={styles.singlePointValue}>
          {values[0].toFixed(1)} {displayUnit}
        </Text>
        <Text style={styles.singlePointHint}>Add another entry to see a trend</Text>
      </View>
    );
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const points = values.map((value, index) => {
    const x = PADDING_LEFT + (plotWidth * index) / (values.length - 1);
    const y =
      range === 0
        ? PADDING_TOP + plotHeight / 2
        : PADDING_TOP + plotHeight - ((value - minValue) / range) * plotHeight;
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const firstLabel = entries[0].recorded_at.slice(5);
  const lastLabel = entries[entries.length - 1].recorded_at.slice(5);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`Weight trend chart. ${entries.length} entries from ${firstLabel} to ${lastLabel}, ranging from ${minValue.toFixed(1)} to ${maxValue.toFixed(1)} ${displayUnit}.`}
    >
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <SvgText x={0} y={PADDING_TOP + 4} fontSize={10} fill="#888">
          {maxValue.toFixed(1)}
        </SvgText>
        <SvgText x={0} y={PADDING_TOP + plotHeight} fontSize={10} fill="#888">
          {minValue.toFixed(1)}
        </SvgText>
        <Line
          x1={PADDING_LEFT}
          y1={PADDING_TOP + plotHeight}
          x2={CHART_WIDTH - PADDING_RIGHT}
          y2={PADDING_TOP + plotHeight}
          stroke="#eee"
          strokeWidth={1}
        />
        <Polyline points={polylinePoints} fill="none" stroke="#111" strokeWidth={2} />
        {points.map((point, index) => (
          <Circle key={index} cx={point.x} cy={point.y} r={3} fill="#111" />
        ))}
        <SvgText x={PADDING_LEFT} y={CHART_HEIGHT - 6} fontSize={10} fill="#888">
          {firstLabel}
        </SvgText>
        <SvgText
          x={CHART_WIDTH - PADDING_RIGHT - 24}
          y={CHART_HEIGHT - 6}
          fontSize={10}
          fill="#888"
        >
          {lastLabel}
        </SvgText>
      </Svg>
      <Text style={styles.unitLabel}>Weight ({displayUnit})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  unitLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  singlePointContainer: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    paddingVertical: 20,
  },
  singlePointValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  singlePointHint: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
});
