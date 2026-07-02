import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/** App-wide toast host. Follows the active theme. */
export function Toaster(props: ToasterProps) {
  const { theme = 'system' } = useTheme();
  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      {...props}
    />
  );
}
