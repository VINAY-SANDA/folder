import { Link } from 'wouter';

interface CategoryItemProps {
  icon: string;
  name: string;
  color: string;
  bgColor: string;
  href: string;
}

export default function CategoryItem({ icon, name, color, bgColor, href }: CategoryItemProps) {
  return (
    <Link href={href}>
      <div className="flex flex-col items-center p-4 rounded-lg hover:bg-white hover:shadow-card transition duration-200 cursor-pointer">
        <div className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mb-3`}>
          <span className={`material-icons ${color}`}>{icon}</span>
        </div>
        <span className="text-center font-medium">{name}</span>
      </div>
    </Link>
  );
}
