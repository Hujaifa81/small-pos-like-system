import React from 'react';
import { useParams } from 'react-router-dom';

export default function ProductEdit() {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit Product</h1>
      <p className="mt-4">Editing product ID: {id}</p>
    </div>
  );
}
