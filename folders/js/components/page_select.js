import React, { Component } from 'react';
import { Pagination } from 'react-bootstrap';


class PageSelect extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentPage: props.currentPage,
      totalPages: props.totalPages
    }
  }

  handlePageBtnClick(pageNum) {
    this.props.onPageBtnClick(pageNum)
  }

  render() {
    if (this.props.totalPages === 1) {
      return <div />
    }
    let items = [];
    for (let number = 1; number <= this.props.totalPages; number++) {
      items.push(
        <Pagination.Item
          active={number === this.props.currentPage}
          onClick={event => this.handlePageBtnClick(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    return (
      <div className="row">
        <div className="col-md-12">
          <Pagination bsSize="medium">{items}</Pagination>
        </div>
      </div>
    );
  }
}

export default PageSelect;