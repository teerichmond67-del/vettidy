import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type TimeListInputProps = {
  times: string[];
  onChange: (times: string[]) => void;
};

function formatTime(hours: number, minutes: number) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function TimeListInput({ times, onChange }: TimeListInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleAdd = () => setShowPicker(true);

  const handleRemove = (time: string) => {
    onChange(times.filter((t) => t !== time));
  };

  return (
    <View>
      <View style={styles.chipRow}>
        {times.map((time) => (
          <Pressable
            key={time}
            style={styles.chip}
            onPress={() => handleRemove(time)}
            hitSlop={16}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${time}`}
          >
            <Text style={styles.chipText}>{time} ✕</Text>
          </Pressable>
        ))}
        <Pressable
          style={styles.addChip}
          onPress={handleAdd}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Add a daily time"
        >
          <Text style={styles.addChipText}>+ Add Time</Text>
        </Pressable>
      </View>

      {showPicker ? (
        <DateTimePicker
          value={new Date()}
          mode="time"
          onChange={(event, selectedDate) => {
            setShowPicker(Platform.OS === 'ios');
            if (event.type === 'set' && selectedDate) {
              const time = formatTime(selectedDate.getHours(), selectedDate.getMinutes());
              if (!times.includes(time)) {
                onChange([...times, time].sort());
              }
            }
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
