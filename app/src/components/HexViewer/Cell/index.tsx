import React from 'react';

import styles from './styles.module.scss'

interface RowProps {
  data: number | string;
  index: number;
  column?: string;
}

const Cell = ({ column, data, index }: RowProps) => (
  <div
    key={`${index}-${data}`}
    className={styles.Cell}
    data-index={index}
    data-column={column}
  >
    {data}
  </div>
);

export default Cell;
