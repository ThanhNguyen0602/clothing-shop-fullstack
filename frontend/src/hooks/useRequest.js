import { useEffect, useState } from "react";

const useRequest = (load, id, page = 1) => {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        const data = await load(id, page, controller.signal);
        if (!controller.signal.aborted) {
          setResult({ id, page, attempt, data });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ id, page, attempt, error });
        }
      }
    };

    run();

    return () => controller.abort();
  }, [load, id, page, attempt]);

  const current = result?.id === id && result.page === page &&
    result.attempt === attempt ? result : null;

  const retry = () => setAttempt((value) => value + 1);

  return { data: current?.data, error: current?.error,
    loading: current === null, retry };
};

export default useRequest;
