import { createRoot } from 'react-dom/client';
import Applet from './Applet.jsx';
import styles from './applet.css?inline';

// The applet is this one file: it brings its styles with it and draws itself in
// every element of the page that has the class var-reverberation.
const style = document.createElement('style');
style.textContent = styles;
document.head.append(style);

for (const element of document.querySelectorAll('.var-reverberation')) {
  createRoot(element).render(<Applet />);
}
