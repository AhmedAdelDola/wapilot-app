import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch } from '@/hooks';
import { conversationActions } from '@/store/conversation/conversationActions';

const TYPING_IDLE_MS = 4000;

export const useChatTyping = (conversationId: number, isPrivate: boolean) => {
  const dispatch = useAppDispatch();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dispatchTypingStatus = useCallback(
    (status: 'on' | 'off') => {
      dispatch(
        conversationActions.toggleTyping({
          conversationId,
          typingStatus: status,
          isPrivate,
        }),
      );
    },
    [dispatch, conversationId, isPrivate],
  );

  const stopTyping = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    dispatchTypingStatus('off');
  }, [dispatchTypingStatus]);

  useEffect(() => stopTyping, [stopTyping]);

  const onTextChange = useCallback(() => {
    dispatchTypingStatus('on');
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }, [dispatchTypingStatus, stopTyping]);

  const onBlur = useCallback(() => {
    stopTyping();
  }, [stopTyping]);

  return { onTextChange, onBlur };
};
