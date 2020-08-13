import { Circulation, Content } from '@circulate/types';

export const createContentHtml = (content: Content): string => `
        <p>
        ${content.title} | ${content.createdBy}
        </p>
        <span>  ${content.description}</span>
        `;

export const createCirculationHtmlForUser = (
  circulation: Circulation
): string[] => {
  const circlesInfo: string[] = [];
  circulation.circleDetails.forEach((circle) => {
    circlesInfo.push(`
      <h3>${circle.name}<h3>
      <h4>Content</h4>
      ${circle.contentDetails.map((content) => createContentHtml(content))}
      <hr />
      `);
  });
  return circlesInfo;
};
