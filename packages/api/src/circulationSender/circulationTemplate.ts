export default `
<div>
<p style="font-size: 10px; margin: 0">Here is today's curation from all of your Circles.</p>
<br />
<p style="font-size: 10px; margin: 0">Click the ☆ to save to your Circulate Event and Post Archive and have it automatically go to your calendar</p>
<p style="font-size: 10px; margin: 0">Submit a Post</p>
<p style="font-size: 10px; margin: 0">Leave a Circle</p>
<p style="font-size: 10px; margin: 0">Pause all Emails</p>

    {{#with circulation}}
        {{#if upcomingEvents}}
            <h3>Upcoming events</h3>
            {{#each upcomingEvents}}
                <h4>{{dateTime}}</h4>
                {{#each events}}
                    <div>
                        {{#if link}}
                            <p style="margin: 0; margin-bottom: 5px">
                                ☆ <a href={{{link}}}>{{title}}</a> | {{createdBy}} | {{circle.name}}
                            </p>
                        {{/if}}
                        {{#unless link}}
                            <p style="margin: 0; margin-bottom: 5px">
                                ☆ {{title}} | {{createdBy}} | {{circle.name}}
                            </p>
                        {{/unless}}

                        {{#if description}}
                            <span style="margin-left: 5px;">{{description}}</span>
                        {{/if}}
                    </div>
                {{/each}}
            {{/each}}
        {{/if}}
        <hr />

        <h3>Your Circles posts</h3>
        {{#each circleDetails}}
            <h4 style="margin: 0; padding: 0; margin-bottom: 5px;">
                <a href=https://beta.circulate.social/circles/{{id}}>{{name}}</a>
            </h4>
            <div style="margin-left: 5px;">
                <h5>Posts</h5>
                {{#each upcomingPosts}}
                    <div>
                        {{#if link}}
                            <p style="margin: 0; margin-bottom: 5px">
                               ☆ <a href={{{link}}}>{{title}}</a> | {{createdBy}}
                            </p>
                        {{/if}}
                        {{#unless link}}
                            <p style="margin: 0; margin-bottom: 5px">
                               ☆ {{title}} | {{createdBy}}
                            </p>
                        {{/unless}}

                        {{#if description}}
                            <span style="margin-left: 5px;">{{description}}</span>
                        {{/if}}
                    </div>
                {{/each}}
            </div>
        {{/each}}
    {{/with}}
</div>`;
