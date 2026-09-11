"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * 한 글자씩 타이핑되는 제목. 한글은 완성형 음절 단위로 찍힌다.
 * 다 찍힌 뒤에도 커서가 잠시 깜빡이다 사라진다.
 */
export default function TextThree({
  text = "Namaste World!",
  speed = 100,
  className = "",
}: {
  text?: string;
  speed?: number;
  className?: string;
}) {
  const [displayText, setDisplayText] = useState("");
  const done = displayText.length >= text.length;

  useEffect(() => {
    let currentIndex = 0;
    setDisplayText("");
    const intervalId = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, speed);
    return () => clearInterval(intervalId);
  }, [text, speed]);

  return (
    <motion.span
      className={`inline-flex items-baseline whitespace-nowrap font-semibold tracking-tight ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      aria-label={text}
    >
      <span aria-hidden>{displayText}</span>
      <motion.span
        aria-hidden
        className="ml-1 inline-block w-[0.06em] self-stretch rounded-sm bg-accent"
        animate={{ opacity: [1, 1, 0, 0] }}
        transition={{ duration: 1, repeat: done ? 3 : Infinity, times: [0, 0.5, 0.5, 1] }}
        style={{ opacity: done ? 0 : 1 }}
      />
    </motion.span>
  );
}
