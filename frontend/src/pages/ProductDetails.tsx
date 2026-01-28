import { useParams } from 'react-router-dom';

export default function ProductDetails() {
  const { id } = useParams();
  return (
    <div>
      <h1 className="text-2xl font-bold">Product {id}</h1>
      <p className="mt-4">Product detail will be shown here.</p>
    </div>
  );
}
