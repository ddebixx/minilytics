"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, Monitor } from "lucide-react"

type Theme = "light" | "dark" | "system"

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("theme") as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else {
      applyTheme("system")
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    
    if (newTheme === "dark") {
      root.classList.add("dark")
    } else if (newTheme === "light") {
      root.classList.remove("dark")
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    applyTheme(newTheme)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Customize your Minilytics experience
        </p>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Theme Settings */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Appearance
          </h2>
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  theme === "light"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                <Sun className="h-6 w-6" />
                <span className="text-sm font-medium">Light</span>
              </button>

              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  theme === "dark"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                <Moon className="h-6 w-6" />
                <span className="text-sm font-medium">Dark</span>
              </button>

              <button
                onClick={() => handleThemeChange("system")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  theme === "system"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                <Monitor className="h-6 w-6" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Account
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Notifications
              </label>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Coming soon: Receive weekly analytics reports
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Privacy
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Retention
              </label>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Coming soon: Configure how long to keep analytics data
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
