import FoodListingForm from "@/components/food-listing-form";

export default function CreateListing() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Share Your Food</h1>
      <div className="max-w-3xl mx-auto">
        <FoodListingForm />
      </div>
    </div>
  );
}
