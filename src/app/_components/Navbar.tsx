import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="w-full py-3 px-6">
      <div className="max-w-7xl mx-auto flex justify-center space-x-8">
        <Link
          href="/"
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          Create Promise
        </Link>
        <Link
          href="/dash"
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          View Promises
        </Link>
        <span
          className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          How it works
        </span>
      </div>
    </nav>
  );
}