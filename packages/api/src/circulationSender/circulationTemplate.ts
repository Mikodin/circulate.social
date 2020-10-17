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
                <div style="margin-bottom: 10px;">
                    <h4 style="margin:0; margin-bottom: 5px;">{{dateTime}}</h4>
                    {{#each events}}
                        <div style="margin-bottom:5px;>
                            {{#if link}}
                                <p style="margin: 0;">
                                    ☆ <a href={{{link}}}>{{title}}</a> | {{createdBy}} | <a href=https://beta.circulate.social/circles/{{circle.id}}>{{circle.name}}</a> | {{time}}
                                </p>
                            {{/if}}
                            {{#unless link}}
                                <p style="margin: 0;">
                                    ☆ {{title}} | {{createdBy}} | <a href=https://beta.circulate.social/circles/{{circle.id}}>{{circle.name}}</a> | {{time}}
                                </p>
                            {{/unless}}

                            {{#if description}}
                                <p style="margin:0; margin-left: 25px;">{{description}}?</p>
                            {{/if}}
                        </div>
                    {{/each}}
                </div>
            {{/each}}
        {{/if}}
        <hr />

        <h3>Your Circles posts</h3>
        {{#each circleDetails}}
            {{#if circleDetails.upcomingPosts}}
                <h4 style="margin: 0; margin-bottom: 5px;">
                    <a href=https://beta.circulate.social/circles/{{id}}>{{name}}</a>
                </h4>
                <div style="margin-left: 5px;">
                    <h5 style="margin: 0;">Posts</h5>
                    {{#each upcomingPosts}}
                        <div style="margin-bottom: 5px;">
                            {{#if link}}
                                <p style="margin:0;">
                                ☆ <a href={{{link}}}>{{title}}</a> | {{createdBy}}
                                </p>
                            {{/if}}
                            {{#unless link}}
                                <p style="margin:0;">
                                ☆ {{title}} | {{createdBy}}
                                </p>
                            {{/unless}}

                            {{#if description}}
                                <p style="margin:0; margin-left: 25px;">{{description}}</p>
                            {{/if}}
                        </div>
                    {{/each}}
                </div>
            {{/if}}
        {{/each}}
    {{/with}}
</div>`;
