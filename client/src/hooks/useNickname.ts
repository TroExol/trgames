import { useLocalStorage } from 'usehooks-ts';

export const useNickname = () => {
  const [nickname, setNickname] = useLocalStorage('nickname', '');
  return [nickname, setNickname] as const;
};
