import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import chunk from 'lodash/chunk';
import debounce from 'lodash/debounce';
import startCase from 'lodash/startCase';

import { detectNonPrintable, getElement } from './utilities';
import { Column } from './types';

import Row from './Row';
import Cell from './Cell';

import styles from './styles.module.scss'

interface HexViewerProps {
  data: string | Uint8Array;
  isBinary: boolean;
}

const PADDING_OFFSET = 100;
const CELL_WIDTH = 70;

export default function Index({ data, isBinary }: HexViewerProps) {
  const textColumnRef = useRef<HTMLDivElement>(null);
  const [columnsNumber, setColumnsNumber] = useState(5);

  let rawData;
  let hexData;
  let parsedData;
  let chunkedData;
  let chunkedText;

  if (isBinary) {
    rawData = Array.from(new Uint8Array(data as Uint8Array));
    hexData = rawData.map(item => item.toString(16));
    parsedData = new TextDecoder('ASCII').decode(data as Uint8Array);
    chunkedData = chunk(rawData, columnsNumber);
    chunkedText = chunk(parsedData, columnsNumber);
  } else {
    rawData = parsedData = (data as string).split('');
    hexData = rawData.map(item => item.charCodeAt(0).toString(16));
    chunkedData = chunkedText = chunk(rawData, columnsNumber);
  }

  useEffect(() => {
    const handleColumnsNumber = (): void => {
      const textWidth = textColumnRef.current?.clientWidth ?? 0;
      const columnsDisplayWidth = window.innerWidth - textWidth - PADDING_OFFSET;
      const columnsNumber = Math.floor(columnsDisplayWidth / 2 / CELL_WIDTH);
      const number = Math.max(columnsNumber, 1);

      setColumnsNumber(number);
    };

    handleColumnsNumber();

    window.addEventListener('resize', debounce(handleColumnsNumber, 100));

    return (): void => {
      window.removeEventListener('resize', handleColumnsNumber);
    };
  }, [textColumnRef.current]);

  useEffect(() => {
    const handleSelection = (event): void => {
      const key = event.keyCode || event.which;
      const selection = window.getSelection();

      if (key !== 16 && key !== 1 || selection === null) return;

      const targetElements = Array.from(document.querySelectorAll('[data-index]'));

      targetElements.forEach(element => {
        (element as HTMLElement).style.fontWeight = 'unset';
      })

      const anchorNode = selection?.anchorNode && getElement(selection.anchorNode);
      const focusNode = selection?.focusNode && getElement(selection.focusNode);
      let startNode = anchorNode;
      let endNode = focusNode;

      // Handle click on selection
      if (!anchorNode?.hasAttribute('data-index')) {
        selection?.removeAllRanges();

        return;
      }

      let startIndex = Number(anchorNode?.getAttribute('data-index'));
      let endIndex = Number(focusNode?.getAttribute('data-index'));

      const startColumn = anchorNode?.getAttribute('data-column');
      const endColumn = focusNode?.getAttribute('data-column');
      const isColumnSame = startColumn === endColumn;
      const range = document.createRange();
      let isDirectSelection = true;

      if (anchorNode && focusNode) {
        const positionValue = anchorNode.compareDocumentPosition(focusNode);

        // Handle reverse selection order
        if (positionValue === 2) {
          const startIndexCopy = startIndex;

          startIndex = endIndex;
          endIndex = startIndexCopy;
          isDirectSelection = false;
        }

        // Handle selection start and end in different column-sections
        if (!isColumnSame) {
          if (isDirectSelection) {
            endIndex = rawData.length - 1;
          } else {
            startIndex = 0;
          }
        }

        const startSelectors = `[data-index='${startIndex}'][data-column='${startColumn}']`;
        startNode = document.querySelector(startSelectors);
        const endSelectors = `[data-index='${endIndex}'][data-column='${startColumn}']`;
        endNode = document.querySelector(endSelectors);

        if (startNode && endNode) {
          // Handle anchor and focus elements when text node is not (fully) selected
          range.setStartBefore(startNode);
          range.setEndAfter(endNode);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }

      // Highlighting of data in other column-sections
      for (let i = startIndex; i <= endIndex; i++) {
        const selectors = `[data-index='${i}']:not([data-column='${startColumn}'])`;
        const targetElements: Array<HTMLElement> = Array.from(document.querySelectorAll(selectors));

        targetElements.forEach(element => {
          (element as HTMLElement).style.fontWeight = 'bold';
        })
      }

      // Coping to the clipboard
      let dataSource: Array<string | number>;

      switch (startColumn) {
        case Column.DATA:
          dataSource = rawData;
          break;
        case Column.HEX:
          dataSource = hexData;
          break;
        case Column.TEXT:
          dataSource = parsedData;
          break;
        default:
          dataSource = [];
          console.warn('Data source is not defined');
      }

      const copyValue = dataSource.slice(startIndex, endIndex + 1);

      navigator.clipboard.writeText(copyValue.toString());
    };

    window.addEventListener('keyup', handleSelection);
    window.addEventListener('mouseup', handleSelection);

    return (): void => {
      window.removeEventListener('keyup', handleSelection);
      window.removeEventListener('mouseup', handleSelection);
    };
  }, [data]);

  return (
    <div className={styles.Wrapper}>
      <pre style={{ overflowWrap: 'break-word', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        Here comes the HexViewer<br />{ data }
      </pre>
      <div className={styles.Content}>
        <div className={styles.Data}>
          <div className={styles.ColumnTitle}>
            <div>{startCase(Column.DATA)}</div>
            <Row data={Array.from(Array(columnsNumber).keys())} />
          </div>
          <div
            className={styles.ColumnValues}
            style={{ gridTemplateColumns: `repeat(${columnsNumber}, 1fr)` }}
          >
            {rawData.map((cell, index) => (
              <Cell
                key={`${index}-${cell}`}
                data={cell}
                index={index}
                column={Column.DATA}
              />
            ))}
          </div>
        </div>
        <div className={styles.Hex}>
          <div className={styles.ColumnTitle}>
            <div>{startCase(Column.HEX)}</div>
            <Row data={Array.from(Array(columnsNumber).keys())} />
          </div>
          <div
            className={styles.ColumnValues}
            style={{ gridTemplateColumns: `repeat(${columnsNumber}, 1fr)` }}
          >
            {hexData.map((cell, index) => (
              <Cell
                key={`${index}-${cell}`}
                data={cell}
                index={index}
                column={Column.HEX}
              />
            )
            )}
          </div>
        </div>
        <div className={styles.Text} ref={textColumnRef}>
          <div className={cx(styles.ColumnTitle, styles.TextTitle)}>{startCase(Column.TEXT)}</div>
          {chunkedText.map((chunk, rowIndex) => {
            const dec = chunkedData[rowIndex];

            const textArray = chunk.map((item, index) => {
              const isNonPrintable = detectNonPrintable(item, dec[index]);

              return (
                <span
                  key={`${index}-${item}`}
                  style={{color: isNonPrintable ? 'red' : 'black'}}
                  data-index={rowIndex * columnsNumber + index}
                  data-column={Column.TEXT}
                >
                  {isNonPrintable ? '*' : item}
                </span>
              );
            });

            return (
              <div
                key={`${rowIndex}-${chunk[0]}`}
                className={styles.TextRow}
              >
                {textArray}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
