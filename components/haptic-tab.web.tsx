// Web-compatible version of the haptic tab
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';

export function HapticTab(props: BottomTabBarButtonProps) {
  // Skip haptics in web version
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        props.onPressIn?.(ev);
      }}
    />
  );
}