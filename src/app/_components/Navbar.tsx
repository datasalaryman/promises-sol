import Link from "next/link";

export function Navbar() {
  return (
    <header className="w-full px-6 py-3">
      <nav>
        <div className="mx-auto flex max-w-7xl justify-center space-x-8">
          <Link
            href="/"
            className="text-gray-600 transition-colors hover:text-gray-900"
          >
            Create Promise
          </Link>
          <Link
            href="/dash"
            className="text-gray-600 transition-colors hover:text-gray-900"
          >
            View Promises
          </Link>
          <Link
            href="/how-it-works"
            className="text-gray-600 transition-colors hover:text-gray-900"
          >
            How it works
          </Link>
        </div>
      </nav>
    </header>
  );
}
