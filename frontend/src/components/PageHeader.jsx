import { useLayoutEffect } from 'react';
import { usePageMetaRegistry } from '../context/PageMetaContext';

/** Registers page title, subtitle, and actions into the breadcrumb bar (no visible output). */
export default function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onAction,
  children,
}) {
  const { registerMeta, clearMeta } = usePageMetaRegistry() || {};

  useLayoutEffect(() => {
    if (!registerMeta) return undefined;
    registerMeta({
      title,
      subtitle,
      actionLabel,
      actionIcon,
      onAction,
      action: children,
    });
    return () => clearMeta?.();
  }, [
    title,
    subtitle,
    actionLabel,
    actionIcon,
    onAction,
    children,
    registerMeta,
    clearMeta,
  ]);

  return null;
}
