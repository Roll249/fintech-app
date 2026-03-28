"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundController = void 0;
const db_js_1 = require("../../shared/db.js");
class FundController {
    async getFunds(req, res) {
        try {
            const userId = req.user?.id;
            const result = await (0, db_js_1.query)(`SELECT f.*, u.name as owner_name, u.email as owner_email,
                (SELECT COUNT(*) FROM fund_members WHERE fund_id = f.id) as member_count
         FROM funds f
         JOIN users u ON f.owner_id = u.id
         JOIN fund_members fm ON f.id = fm.fund_id
         WHERE fm.user_id = $1
         ORDER BY f.created_at DESC`, [userId]);
            res.json(result.rows.map(row => ({
                id: row.id,
                name: row.name,
                description: row.description,
                targetAmount: parseFloat(row.target_amount),
                currentAmount: parseFloat(row.current_amount),
                progress: parseFloat(row.current_amount) / parseFloat(row.target_amount),
                coverImageUrl: row.cover_image_url,
                ownerId: row.owner_id,
                owner: { id: row.owner_id, name: row.owner_name, email: row.owner_email },
                memberCount: parseInt(row.member_count),
                status: row.status,
                deadline: row.deadline,
                createdAt: row.created_at,
            })));
        }
        catch (error) {
            console.error('Get funds error:', error);
            res.status(500).json({ error: 'Failed to get funds' });
        }
    }
    async getFund(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            // Get fund with members
            const fundResult = await (0, db_js_1.query)(`SELECT f.*, u.name as owner_name, u.email as owner_email
         FROM funds f
         JOIN users u ON f.owner_id = u.id
         WHERE f.id = $1`, [id]);
            if (fundResult.rows.length === 0) {
                return res.status(404).json({ error: 'Fund not found' });
            }
            const membersResult = await (0, db_js_1.query)(`SELECT fm.*, u.name, u.email, u.avatar_url
         FROM fund_members fm
         JOIN users u ON fm.user_id = u.id
         WHERE fm.fund_id = $1`, [id]);
            const fund = fundResult.rows[0];
            res.json({
                id: fund.id,
                name: fund.name,
                description: fund.description,
                targetAmount: parseFloat(fund.target_amount),
                currentAmount: parseFloat(fund.current_amount),
                progress: parseFloat(fund.current_amount) / parseFloat(fund.target_amount),
                coverImageUrl: fund.cover_image_url,
                ownerId: fund.owner_id,
                owner: { id: fund.owner_id, name: fund.owner_name, email: fund.owner_email },
                members: membersResult.rows.map(m => ({
                    userId: m.user_id,
                    user: { id: m.user_id, name: m.name, email: m.email, avatarUrl: m.avatar_url },
                    role: m.role,
                    contribution: parseFloat(m.contribution),
                    joinedAt: m.joined_at,
                })),
                status: fund.status,
                deadline: fund.deadline,
                createdAt: fund.created_at,
            });
        }
        catch (error) {
            console.error('Get fund error:', error);
            res.status(500).json({ error: 'Failed to get fund' });
        }
    }
    async createFund(req, res) {
        try {
            const userId = req.user?.id;
            const { name, description, targetAmount, coverImageUrl, deadline } = req.body;
            // Create fund
            const result = await (0, db_js_1.query)(`INSERT INTO funds (name, description, target_amount, cover_image_url, owner_id, deadline)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`, [name, description, targetAmount, coverImageUrl, userId, deadline]);
            const fundId = result.rows[0].id;
            // Add owner as member
            await (0, db_js_1.query)(`INSERT INTO fund_members (fund_id, user_id, role) VALUES ($1, $2, 'owner')`, [fundId, userId]);
            res.status(201).json({ id: fundId, message: 'Fund created' });
        }
        catch (error) {
            console.error('Create fund error:', error);
            res.status(500).json({ error: 'Failed to create fund' });
        }
    }
    async updateFund(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { name, description, targetAmount, coverImageUrl, deadline } = req.body;
            const result = await (0, db_js_1.query)(`UPDATE funds SET
           name = COALESCE($1, name),
           description = COALESCE($2, description),
           target_amount = COALESCE($3, target_amount),
           cover_image_url = COALESCE($4, cover_image_url),
           deadline = COALESCE($5, deadline)
         WHERE id = $6 AND owner_id = $7
         RETURNING id`, [name, description, targetAmount, coverImageUrl, deadline, id, userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Fund not found or not owner' });
            }
            res.json({ message: 'Fund updated' });
        }
        catch (error) {
            console.error('Update fund error:', error);
            res.status(500).json({ error: 'Failed to update fund' });
        }
    }
    async deleteFund(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            await (0, db_js_1.query)('DELETE FROM funds WHERE id = $1 AND owner_id = $2', [id, userId]);
            res.json({ message: 'Fund deleted' });
        }
        catch (error) {
            console.error('Delete fund error:', error);
            res.status(500).json({ error: 'Failed to delete fund' });
        }
    }
    async contribute(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { amount, note } = req.body;
            // Add contribution
            await (0, db_js_1.query)(`INSERT INTO fund_contributions (fund_id, user_id, amount, type, note)
         VALUES ($1, $2, $3, 'deposit', $4)`, [id, userId, amount, note]);
            // Update fund amount
            await (0, db_js_1.query)('UPDATE funds SET current_amount = current_amount + $1 WHERE id = $2', [amount, id]);
            // Update member contribution
            await (0, db_js_1.query)('UPDATE fund_members SET contribution = contribution + $1 WHERE fund_id = $2 AND user_id = $3', [amount, id, userId]);
            res.status(201).json({ message: 'Contribution added' });
        }
        catch (error) {
            console.error('Contribute error:', error);
            res.status(500).json({ error: 'Failed to contribute' });
        }
    }
    async withdraw(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { amount, reason } = req.body;
            // Check if user is owner or admin
            const memberResult = await (0, db_js_1.query)('SELECT role FROM fund_members WHERE fund_id = $1 AND user_id = $2', [id, userId]);
            if (memberResult.rows.length === 0 || !['owner', 'admin'].includes(memberResult.rows[0].role)) {
                return res.status(403).json({ error: 'Not authorized to withdraw' });
            }
            // Add withdrawal record
            await (0, db_js_1.query)(`INSERT INTO fund_contributions (fund_id, user_id, amount, type, note)
         VALUES ($1, $2, $3, 'withdraw', $4)`, [id, userId, amount, reason]);
            // Update fund amount
            await (0, db_js_1.query)('UPDATE funds SET current_amount = current_amount - $1 WHERE id = $2', [amount, id]);
            res.status(201).json({ message: 'Withdrawal processed' });
        }
        catch (error) {
            console.error('Withdraw error:', error);
            res.status(500).json({ error: 'Failed to withdraw' });
        }
    }
    async getContributions(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, pageSize = 20 } = req.query;
            const offset = (Number(page) - 1) * Number(pageSize);
            const result = await (0, db_js_1.query)(`SELECT fc.*, u.name, u.email, u.avatar_url
         FROM fund_contributions fc
         JOIN users u ON fc.user_id = u.id
         WHERE fc.fund_id = $1
         ORDER BY fc.created_at DESC
         LIMIT $2 OFFSET $3`, [id, Number(pageSize), offset]);
            res.json({
                items: result.rows.map(row => ({
                    id: row.id,
                    fundId: row.fund_id,
                    userId: row.user_id,
                    user: { id: row.user_id, name: row.name, email: row.email, avatarUrl: row.avatar_url },
                    amount: parseFloat(row.amount),
                    type: row.type,
                    note: row.note,
                    createdAt: row.created_at,
                })),
                page: Number(page),
                pageSize: Number(pageSize),
            });
        }
        catch (error) {
            console.error('Get contributions error:', error);
            res.status(500).json({ error: 'Failed to get contributions' });
        }
    }
    async inviteMember(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { email, role = 'member' } = req.body;
            // Find user by email
            const userResult = await (0, db_js_1.query)('SELECT id FROM users WHERE email = $1', [email]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const invitedUserId = userResult.rows[0].id;
            // Add as member
            await (0, db_js_1.query)(`INSERT INTO fund_members (fund_id, user_id, role) VALUES ($1, $2, $3)
         ON CONFLICT (fund_id, user_id) DO NOTHING`, [id, invitedUserId, role]);
            res.status(201).json({ message: 'Member invited' });
        }
        catch (error) {
            console.error('Invite member error:', error);
            res.status(500).json({ error: 'Failed to invite member' });
        }
    }
    async removeMember(req, res) {
        try {
            const { id, userId: targetUserId } = req.params;
            await (0, db_js_1.query)('DELETE FROM fund_members WHERE fund_id = $1 AND user_id = $2 AND role != $3', [id, targetUserId, 'owner']);
            res.json({ message: 'Member removed' });
        }
        catch (error) {
            console.error('Remove member error:', error);
            res.status(500).json({ error: 'Failed to remove member' });
        }
    }
}
exports.FundController = FundController;
//# sourceMappingURL=fund.controller.js.map