import { useLongPress } from "../lib/useLongPress";

interface Props {
  onSelect: () => void;
  /** Segurar pra excluir. Sem isso o chip é só um botão normal. */
  onLongPress?: () => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * O chip do app inteiro: toque escolhe, segurar exclui.
 *
 * Um componente só pra atividade, variação e categoria — se o gesto morasse
 * em cada tela, uma delas ficaria de fora e o app viraria uma loteria de
 * "aqui dá, ali não dá".
 */
export function LongPressChip({
  onSelect,
  onLongPress,
  className = "",
  style,
  disabled,
  children,
}: Props) {
  const { pressing, handlers } = useLongPress({
    onLongPress: onLongPress ?? (() => {}),
    onClick: onSelect,
  });

  return (
    <button
      {...(onLongPress ? handlers : { onClick: onSelect })}
      disabled={disabled}
      className={`transition-transform duration-150 ${pressing ? "scale-95" : ""} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}
