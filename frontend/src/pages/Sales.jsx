import React from 'react';

export default function Sales() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Point of Sale</h2>
      <div className="bg-white shadow sm:rounded-lg p-6">
        <p className="text-gray-500">POS Interface coming soon...</p>
        <div className="mt-4 border-t border-gray-200 pt-4">
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">New Sale</button>
        </div>
      </div>
    </div>
  );
}