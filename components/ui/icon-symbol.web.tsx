// Web-compatible version of the icon symbol component

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'dumbbell.fill': 'fitness-center',
  'tray.and.arrow.down.fill': 'save-alt',
  'arrow.right': 'arrow-forward',
  'person.fill': 'person',
  'calendar': 'event',
  'gear': 'settings',
  'heart.fill': 'favorite',
  'heart': 'favorite-border',
  'bell.fill': 'notifications',
  'bell': 'notifications-none',
  'magnifyingglass': 'search',
  'plus': 'add',
  'minus': 'remove',
  'xmark': 'close',
  'checkmark': 'check',
} as IconMapping;

/**
 * An icon component that uses Material Icons on web.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight, // This prop is ignored in web version
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: string; // Web doesn't support weight
}) {
  // Fallback to a default icon if the mapping doesn't exist
  const iconName = MAPPING[name] || 'help-outline';
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}