import { fail, redirect } from '@sveltejs/kit'
import { error } from '@sveltejs/kit';


let userNow;
export const load = async ({ locals: { supabase, getSession } }) => {
    const session = await getSession()

    if (!session) {
        throw redirect(303, '/')
    }
    const {
        data: { user }
    } = await supabase.auth.getUser();
    // console.log(user);


    let { data: userdetails, error: err } = await supabase
        .from('userdetails')
        .select("*")
        .eq('email', user.email)
    console.log(err);
    userNow = userdetails[0];


    let { data: classes, error: err2 } = await supabase
        .from('classes')
        .select("*")

    if (err2) console.log(err2)
    return { userNow, classes };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}
export const actions = {
    upload: async ({ request, locals: { supabase, getSession } }) => {
        const data = await request.formData();
        //console.log("amar add class form holo", data);

        let newClass = Object.fromEntries(data.entries()) as any;

        let name = newClass.title + "_" + userNow.id;

        //console.log(newClass.title, newClass.syllabus, newClass.start, newClass.duration, name)

        if (newClass.image.size) {
            // console.log(newClass.image);
            const { data: res, error: err } = await supabase.storage
                .from('classimg')
                .upload(name, newClass.image, {
                    cacheControl: '3600',
                    upsert: false
                });

            const { data: link } = await supabase
                .storage
                .from('classimg')
                .getPublicUrl(name)


            console.log(err, link)

            const { data: dt, error: err1 } = await supabase
                .from('classes')
                .insert([
                    { ownerid: userNow.id, syllabus: newClass.syllabus, duration: newClass.duration.toString(), start: formatDate(newClass.start), image: link.publicUrl, title: newClass.title }
                ])


            if (err1) console.log(err1)

        }
        else {

            const { data: dt, error: err1 } = await supabase
                .from('classes')
                .insert([
                    { ownerid: userNow.id, syllabus: newClass.syllabus, duration: newClass.duration.toString(), start: formatDate(newClass.start), title: newClass.title }
                ])


            if (err1) console.log(err1)

        }



        throw redirect(303, '/protected/learning');
    },
    // deleteRequest: async ({ url, locals: { supabase, getSession } }) => {
    //     const requestid = url.searchParams.get("id")
    //     console.log("ami request delete korte chai ", requestid);

    //     if (!requestid) {
    //         return fail(400, { message: "Invalid request" })
    //     }

    //     const { error: err } = await supabase
    //         .from('studclass')
    //         .delete()
    //         .eq("id", requestid)

    //     if (err) console.log(err)
    //     else throw redirect(303, '/trainerverified/classes');

    // },
    // ApproveRequest: async ({ url, locals: { supabase, getSession } }) => {
    //     const requestid = url.searchParams.get("id")
    //     console.log("ami request approve korte chai ", requestid);

    //     if (!requestid) {
    //         return fail(400, { message: "Invalid request" })
    //     }


    //     const { data, error: err } = await supabase
    //         .from('studclass')
    //         .update({ joined: true })
    //         .eq("id", requestid)


    //     if (err) return fail(400, { message: "Invalid request" })
    //     else throw redirect(303, '/trainerverified/classes');

    // },

}