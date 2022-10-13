// ASCII only - data source - https://www.ascii-code.com/
const NON_PRINTABLE_HEX = ['81', '8D', '8F', '90', '9D'];
const NON_PRINTABLE_DEC = [129, 141, 143, 144, 157];

export const detectNonPrintable = (text, dec) => {
 const regExp = /[\x00-\x1F]/;

 return regExp.test(text) || NON_PRINTABLE_DEC.includes(dec);
};

// Check whether an element is a text node or div element
// Handles ending of selection before text node is selected
export const getElement = (element: Node): HTMLElement | null => {
 if (!element) return null;

 return element.nodeType === 1
  ? element.previousSibling as HTMLElement
  : element.parentElement;
}
