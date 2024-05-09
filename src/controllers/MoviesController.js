const knex = require("../database/knex");
const AppError = require("../utils/AppError");

class MoviesController {
  async create(request, response) {
    const { title, description, rating, tags } = request.body;
    const user_id = request.user.id;

    if (rating < 0 || rating > 5) {
      throw new AppError(`O valor do campo 'rating' deve estar entre 0 e 5.`);
    }

    const [note_id] = await knex("MovieNotes").insert({
      title,
      description,
      rating,
      user_id,
    });

    const tagsInsert = tags.map((name) => {
      return {
        note_id,
        name,
        user_id,
      };
    });

    await knex("MovieTags").insert(tagsInsert);

    return response.json();
  }

  async show(request, response) {
    const { id } = request.params;

    const MovieNotes = await knex("MovieNotes").where({ id }).first();
    const tags = await knex("MovieTags").where({ note_id: id }).orderBy("name");

    return response.json({
      ...MovieNotes,
      tags,
    });
  }

  async update(request, response) {
    const { id } = request.params;
    const { description } = request.body;

    const movieNote = await knex("MovieNotes").where({ id }).first();

    if (!movieNote) {
      throw new AppError("Filme não encontrado.", 404);
    }

    await knex("MovieNotes").where({ id }).update({ description });

    return response.json({
      message: "Descrição do filme atualizada com sucesso.",
    });
  }

  async delete(request, response) {
    const { id } = request.params;

    await knex("MovieNotes").where({ id }).delete();

    return response.json();
  }

  async index(request, response) {
    const { title, tags } = request.query;

    const user_id = request.user.id;

    let MovieNotes;

    if (tags) {
      const filterTags = tags.split(",").map((tag) => tag.trim());

      MovieNotes = await knex("MovieTags")
        .select(["MovieNotes.id", "MovieNotes.title", "MovieNotes.user_id"])
        .where("MovieNotes.user_id", user_id)
        .whereLike("MovieNotes.title", `%${title}%`)
        .whereIn("name", filterTags)
        .innerJoin("MovieNotes", "MovieNotes.id", "MovieTags.note_id")
        .groupBy("MovieNotes.id")
        .orderBy("MovieNotes.title");
    } else {
      MovieNotes = await knex("MovieNotes")
        .where({ user_id })
        .whereLike("title", `%${title}%`)
        .orderBy("title");
    }

    const userTags = await knex("MovieTags").where({ user_id });
    const notesWithTags = MovieNotes.map((note) => {
      const noteTags = userTags.filter((tag) => tag.note_id === note.id);

      return {
        ...note,
        tags: noteTags,
      };
    });

    return response.json(notesWithTags);
  }
}

module.exports = MoviesController;
