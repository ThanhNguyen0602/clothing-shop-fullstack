import { useEffect, useState } from "react";
import { getSettings } from "../services/shopService";

const fallback = { shop_name: "TV Studio" };
let cache = null;

// Doc cau hinh cong khai mot lan, dung lai cho header/footer/trang thong tin.
const useSettings = () => {
  const [settings, setSettings] = useState(cache ?? fallback);

  useEffect(() => {
    if (cache) return undefined;

    const controller = new AbortController();
    getSettings(controller.signal)
      .then((data) => {
        cache = { ...fallback, ...data };
        setSettings(cache);
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  return settings;
};

const resetSettingsCache = () => { cache = null; };

export { resetSettingsCache };
export default useSettings;
