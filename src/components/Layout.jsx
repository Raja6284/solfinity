import Header from "./Header"

export function Layout({ children }) {
    return (
      <>
        <Header />
        <main className="">{children}</main> {/* Wrapped content */}
      </>
    );
  }