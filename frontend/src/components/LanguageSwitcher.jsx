import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../store/slices/languageSlice';

export default function LanguageSwitcher({ compact = false, inMenu = false }) {
  const dispatch = useDispatch();
  const lang = useSelector(s => s.language.lang);
  const { t } = useTranslation();

  const group = (
    <ToggleButtonGroup
      data-tour="language-switcher"
      size="small"
      exclusive
      value={lang}
      onChange={(_, value) => value && dispatch(setLanguage(value))}
      aria-label={t('language.switchLabel')}
      fullWidth={inMenu}
    >
      <ToggleButton value="en" aria-label={t('language.english')}>
        {compact || inMenu ? 'EN' : 'English'}
      </ToggleButton>
      <ToggleButton value="hi" aria-label={t('language.hindi')}>
        {compact || inMenu ? 'हिं' : 'हिंदी'}
      </ToggleButton>
    </ToggleButtonGroup>
  );

  if (inMenu) return group;

  return (
    <Tooltip title={t('language.switchLabel')}>
      <span>{group}</span>
    </Tooltip>
  );
}
