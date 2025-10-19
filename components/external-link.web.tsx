// Web-specific version of ExternalLink
import { Href, Link } from 'expo-router';
import { type ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  // On web, just use the standard Link behavior with target="_blank"
  return (
    <Link
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
      href={href}
    />
  );
}