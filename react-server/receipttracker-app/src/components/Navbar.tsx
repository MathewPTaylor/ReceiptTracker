import React from 'react';
import '../styles/navbar.css';
import reactSVG from "../assets/react.svg"

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  ordinal: number;
}

interface BottomNavbarProps {
  items?: NavItem[];
  onNavClickFunc: (num: number) => void;
  curPageNo: number;
}

const defaultItems: NavItem[] = [
  { label: 'Home', href: '#home', ordinal: 0},
  { label: 'Chatbot', href: '#chatbot' , ordinal: 1},
  { label: 'Analytics', href: '#analytics' , ordinal: 2},
  { label: 'Account', href: '#account', ordinal: 3},
];

export const BottomNavbar: React.FC<BottomNavbarProps> = ({ items = defaultItems, curPageNo, onNavClickFunc}) => {

  return (
    <nav className="bottom-navbar" aria-label="Bottom Navigation">
      <ul className="bottom-navbar__list">
        {items.map((item) => (
          <li key={item.label} className="bottom-navbar__item">
            <a
              href={item.href}
              className={`bottom-navbar__link ${
                curPageNo == item.ordinal? 'bottom-navbar__link--active' : ''
              }`.trim()}
              onClick={() => {onNavClickFunc(item.ordinal)}}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNavbar;