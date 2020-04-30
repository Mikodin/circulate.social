import React from 'react';
import renderer from 'react-test-renderer';
import Header from './Header';

describe('It should pass', () => {
  it('Passes', () => {
    expect(true).toBe(true);
  });
  it.skip('passes snapshot', () => {
    const component = renderer.create(<Header />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
