import React from 'react';
import { AppHeader } from './AppHeader';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  fallbackRoute?: string;
  rightComponent?: React.ReactNode;
  showBrand?: boolean;
  showStatusPill?: boolean;
  showThemeToggle?: boolean;
  showNotifications?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  fallbackRoute,
  rightComponent,
  showBrand,
  showStatusPill,
  showThemeToggle,
  showNotifications,
}: PageHeaderProps) {
  return (
    <AppHeader
      variant={showBackButton ? 'subpage' : 'tab'}
      title={title}
      subtitle={subtitle}
      showBackButton={showBackButton}
      onBack={onBack}
      fallbackRoute={fallbackRoute}
      showBrand={showBrand}
      showStatusPill={showStatusPill}
      showThemeToggle={showThemeToggle}
      showNotifications={showNotifications}
      rightActions={rightComponent}
    />
  );
}

export { AppHeader } from './AppHeader';
