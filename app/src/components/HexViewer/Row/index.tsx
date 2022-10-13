import React from 'react';

import styles from './styles.module.scss'

interface RowProps {
  data: Array<number | string>;
  column?: string;
}

const Row = ({ column, data }: RowProps) => (
  <div className={styles.Row}>
    {
      data.map((item, index) => (
        <div
            key={`${index}-${item}`}
            className={styles.Cell}
            data-column={column}
          >
            {item}
          </div>
        ))
    }
  </div>
);

export default Row;
