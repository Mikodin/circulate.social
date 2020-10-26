function generateLegend() {
  const genLineItem = (text: string) =>
    `<p style="font-size: 10px; margin: 0">${text}</p>`;

  return `
<div>
    ${genLineItem(
      `Click the ☆ to save to your Circulate Event and Post Archive and have it automatically go to your calendar.`
    )}
    ${genLineItem(`Submit a Post`)}
    ${genLineItem(`Leave a Circle`)}
    ${genLineItem(`Pause all Emails`)}
</div>`;
}

function generatePost(isEvent: boolean) {
  return `
  <div style="margin-bottom:5px;>
    {{#if link}}
        <p style="margin: 0;">
            ☆ <a href={{{link}}}>{{title}}</a> | {{createdBy}} | <a href=https://beta.circulate.social/circles/{{circle.id}}>{{circle.name}}</a>${
              isEvent ? ' | {{time}}' : ''
            }
        </p>
    {{/if}}
    {{#unless link}}
        <p style="margin: 0;">
            ☆ {{title}} | {{createdBy}} | <a href=https://beta.circulate.social/circles/{{circle.id}}>{{circle.name}}</a>${
              isEvent ? ' | {{time}}' : ''
            }
        </p>
    {{/unless}}

    {{#if description}}
        <p style="margin:0; margin-left: 25px;">{{description}}?</p>
    {{/if}}
</div>`;
}

function generateUpcomingEvents() {
  return `
  <h3>Upcoming events</h3>
    {{#each upcomingEvents}}
        <div style="margin-bottom: 10px;">
            <h4 style="margin:0; margin-bottom: 5px;">{{dateTimeString}}</h4>
            {{#each events}}
                ${generatePost(true)}
            {{/each}}
        </div>
    {{/each}}`;
}

function generateUpcomingPosts() {
  return `
  <h3>Your Circles posts</h3>
    {{#each circleDetails}}
        {{#if upcomingPosts}}
            <h4 style="margin: 0; margin-bottom: 5px;">
                <a href=https://beta.circulate.social/circles/{{id}}>{{name}}</a>
            </h4>
            <div style="margin-left: 5px;">
                <h5 style="margin: 0;">Posts</h5>
                {{#each upcomingPosts}}
                   ${generatePost(false)} 
                {{/each}}
            </div>
        {{/if}}
    {{/each}}`;
}

export default `
<div>
    <h3>Here is today's curation from all of your Circles.</h3>
    ${generateLegend()}
    {{#with circulation}}
        {{#if hasEventsToSend}}
            ${generateUpcomingEvents()}
        {{/if}}
        <hr />
        {{#if hasPostsToSend}}
            ${generateUpcomingPosts()}
        {{/if}}
    {{/with}}
</div>`;
