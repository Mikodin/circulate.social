export default `
<div>
<p>Here are today's curation from your Circles.</p>
<p>Click the ☆ to save to your Circulate Event and Post Archive and have it automatically go to your calendar</p>
<p>Submit a Post</p>
<p>Leave a Circle</p>
<p>Pause all Emails</p>

    {{#with circulation}}
        {{#each circleDetails}}
            <h3 style="margin: 0; padding: 0; margin-bottom: 5px;">
                {{name}}
            </h3>
            <div style="margin-left: 5px;">

                <h4>Events</h4>
                {{#each upcomingEvents}}
                    <div>
                        <p style="margin: 0; margin-bottom: 5px">
                            {{title}} | {{createdBy}}
                        </p>
                        <span style="margin-left: 5px;">{{description}}</span>
                    </div>
                {{/each}}

                <h4>Posts</h4>
                {{#each upcomingPosts}}
                    <div>
                        <p style="margin: 0; margin-bottom: 5px">
                            {{title}} | {{createdBy}}
                        </p>
                        <span style="margin-left: 5px;">{{description}}</span>
                    </div>
                {{/each}}
            </div>
            <hr />
        {{/each}}
    {{/with}}
</div>`;
