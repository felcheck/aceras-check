"use client";

import React, { useState, useEffect } from "react";

interface HeaderProps {
  numUsers: number;
}

export default function Header({ numUsers }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

  // Initialize dark mode from system preference and localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md dark:shadow-xl rounded-b-lg px-6 py-4 flex items-center justify-between">
        {/* Title section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ¡Chequea tu acera!
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tus reportes permitirán visibilizar obstáculos y priorizar mejoras a la caminabilidad de tu cuidad.
          </p>
        </div>

        {/* Right section: Toggle and User Count */}
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              // Sun icon for light mode
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {/* User count badge */}
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
            {numUsers} user{numUsers !== 1 ? "s" : ""}
          </div>
        </div>
      </header>
    </div>
  );
}
