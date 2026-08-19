import { I18n } from 'i18n-js';

import af from './i18n/af.json';
import ar from './i18n/ar.json';
import ca from './i18n/ca.json';
import cs from './i18n/cs.json';
import da from './i18n/da.json';
import de from './i18n/de.json';
import en from './i18n/en.json';
import el from './i18n/el.json';
import es from './i18n/es.json';
import fa from './i18n/fa.json';
import fi from './i18n/fi.json';
import fr from './i18n/fr.json';
import he from './i18n/he.json';
import hi from './i18n/hi.json';
import hr from './i18n/hr.json';
import hu from './i18n/hu.json';
import id from './i18n/id.json';
import it from './i18n/it.json';
import ja from './i18n/ja.json';
import ko from './i18n/ko.json';
import ml from './i18n/ml.json';
import ms from './i18n/ms.json';
import nl from './i18n/nl.json';
import no from './i18n/no.json';
import pl from './i18n/pl.json';
import pt from './i18n/pt.json';
import pt_BR from './i18n/pt_BR.json';
import ro from './i18n/ro.json';
import ru from './i18n/ru.json';
import sq from './i18n/sq.json';
import sr from './i18n/sr.json';
import sv from './i18n/sv.json';
import ta from './i18n/ta.json';
import tr from './i18n/tr.json';
import uk from './i18n/uk.json';
import vi from './i18n/vi.json';
import zh from './i18n/zh.json';
import zh_CN from './i18n/zh_CN.json';
import zh_TW from './i18n/zh_TW.json';
import sl from './i18n/sl.json';
import sh from './i18n/sh.json';

const i18nInstance = new I18n(
  {
    af,
    ar,
    ca,
    cs,
    da,
    de,
    el,
    en,
    es,
    fa,
    fi,
    fr,
    he,
    hi,
    hr,
    hu,
    id,
    it,
    ja,
    ko,
    ml,
    ms,
    nl,
    no,
    pl,
    pt,
    pt_BR,
    ro,
    ru,
    sh,
    sl,
    sq,
    sr,
    sv,
    ta,
    tr,
    uk,
    vi,
    zh,
    zh_CN,
    zh_TW,
  },
  { enableFallback: true, defaultLocale: 'en' },
);

i18nInstance.locale = 'en';

const i18n = {
  get locale() {
    return i18nInstance.locale;
  },
  set locale(value: string) {
    i18nInstance.locale = value;
  },
  t: (key: string, params?: Record<string, unknown>): string => {
    try {
      let result = i18nInstance.t(key);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
        });
      }
      return result;
    } catch {
      return key;
    }
  },
};

export default i18n;
