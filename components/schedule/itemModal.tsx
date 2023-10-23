"use client";

import { useState, useEffect, useContext, useCallback } from "react";

import { AppContext, type AppContextValue } from "../provider";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export const ItemModalProvider: React.FC<Props> = ({ children }) => {
  const { state, setState } = useContext(AppContext) as AppContextValue;

  const router = useRouter();
  // const path = usePathname();

  const showModal = state.itemModal.show;

  const setShowModal = useCallback(
    (show: boolean) => {
      setState({
        ...state,
        itemModal: {
          ...state.itemModal,
          show,
        },
      });
    },
    [setState, state],
  );

  useEffect(() => {
    const path = window.location.pathname;
    if (showModal && state.itemModal.data) {
      const newpath = `${path}?id=${state.itemModal.data.ids.tmdb}`;
      window.history.pushState({}, "", newpath);
    } else {
      // router.push(path, { scroll: false });
      window.history.pushState({}, "", path);
    }
  }, [showModal, state, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const modal = document.querySelector("[data-role='modal']");
      if (modal && !modal.contains(event.target as Node)) {
        setShowModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowModal]);

  return (
    <>
      {showModal && (
        <>
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black opacity-50 blur-lg"></div>
          </div>
          <div
            data-role="modal"
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-background rounded-lg shadow-lg p-4 h-full w-full max-w-[800px] max-h-[600px] box-border flex flex-col items-start justify-start text-left text-floralwhite-100 border-[2px] border-solid border-floralwhite-200/20"
          >
            <button
              className="absolute top-0 right-0 p-2"
              onClick={() => setShowModal(false)}
            >
              X
            </button>
            {/* display all data with text wrapping */}
            <pre className="text-sm font-text-sm-font-normal whitespace-pre-wrap">
              {JSON.stringify(state.itemModal.data, null, 2)}
            </pre>
          </div>
        </>
      )}
      <div className="relative">{children}</div>
    </>
  );
};
